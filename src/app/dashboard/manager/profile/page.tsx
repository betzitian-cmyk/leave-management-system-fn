'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Mail, Shield, Calendar, Edit, Trash2, Upload, Loader2, X } from 'lucide-react';
import { profileApi } from '@/lib/api/profile';
import { authApi } from '@/lib/api/auth';
import { storage } from '@/lib/storage';
import type { User as UserType } from '@/types';
import { toast } from 'sonner';

export default function ManagerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserType | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeletePictureDialog, setShowDeletePictureDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileApi.getProfile();

      if (response.success && response.data) {
        setProfile(response.data);
        // Update storage with latest user data
        storage.setUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshUserInStorage = async () => {
    try {
      const userInfoResponse = await authApi.getUserInfo();
      if (userInfoResponse.success && userInfoResponse.data) {
        storage.setUser(userInfoResponse.data);
        // Force a page reload to update auth context
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to refresh user info:', error);
    }
  };

  const handleEditClick = () => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setEmail(profile.email);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    setShowEditDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);

      const updates: {
        firstName?: string;
        lastName?: string;
        email?: string;
        profilePicture?: File;
      } = {};

      if (firstName !== profile?.firstName) updates.firstName = firstName;
      if (lastName !== profile?.lastName) updates.lastName = lastName;
      if (email !== profile?.email) updates.email = email;
      if (selectedFile) updates.profilePicture = selectedFile;

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save');
        return;
      }

      const response = await profileApi.updateProfile(updates);

      if (response.success) {
        toast.success('Profile updated successfully');
        setShowEditDialog(false);
        await fetchProfile();
        await refreshUserInStorage();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      setDeleting(true);
      const response = await profileApi.deleteProfilePicture();

      if (response.success) {
        toast.success('Profile picture deleted successfully');
        setShowDeletePictureDialog(false);
        await fetchProfile();
        await refreshUserInStorage();
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      toast.error('Failed to delete profile picture');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center">
        <User className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">Profile not found</h3>
        <p className="text-muted-foreground text-sm">Unable to load profile information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information</p>
        </div>
        <Button onClick={handleEditClick} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Card */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Picture Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Your avatar image</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profile.profilePicture} alt={profile.firstName} />
              <AvatarFallback className="text-2xl">
                {profile.firstName.charAt(0).toUpperCase()}
                {profile.lastName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {profile.profilePicture && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeletePictureDialog(true)}
                className="w-full cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Picture
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2 text-xs">
                  <User className="h-4 w-4" />
                  First Name
                </Label>
                <p className="text-lg font-medium">{profile.firstName}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2 text-xs">
                  <User className="h-4 w-4" />
                  Last Name
                </Label>
                <p className="text-lg font-medium">{profile.lastName}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <p className="text-lg font-medium">{profile.email}</p>
                <div className="flex items-center gap-2">
                  {profile.emailVerified ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      Not Verified
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Shield className="h-4 w-4" />
                  Role
                </Label>
                <Badge variant="default" className="text-sm">
                  {profile.role}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Calendar className="h-4 w-4" />
                  Last Login
                </Label>
                <p className="text-sm">{formatDate(profile.lastLogin)}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Status</Label>
                <Badge variant={profile.isActive ? 'outline' : 'destructive'}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePicture">Profile Picture</Label>
              {previewUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-32 w-32 rounded-lg object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveSelectedFile}
                    className="absolute -top-2 -right-2 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('profilePicture')?.click()}
                    className="w-full cursor-pointer"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={updating}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={updating} className="cursor-pointer">
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Profile Picture Dialog */}
      <Dialog open={showDeletePictureDialog} onOpenChange={setShowDeletePictureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile Picture</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove your profile picture? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeletePictureDialog(false)}
              disabled={deleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteProfilePicture}
              disabled={deleting}
              variant="destructive"
              className="cursor-pointer"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Picture
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
